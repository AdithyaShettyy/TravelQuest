from flask import Flask, request, jsonify
import cv2
import numpy as np
import imagehash
from PIL import Image
from skimage.metrics import structural_similarity as ssim
import exifread
import os
import math
from datetime import datetime

app = Flask(__name__)

# Configuration
GPS_VERIFICATION_RADIUS = int(os.getenv('GPS_VERIFICATION_RADIUS', 50))  # meters
MIN_PHASH_SIMILARITY = 85  # percentage
MIN_SSIM_SCORE = 0.6
MIN_KEYPOINT_MATCHES = 10

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'verification'})

@app.route('/verify', methods=['POST'])
def verify_submission():
    """
    Main verification endpoint that combines GPS, EXIF, and visual checks
    """
    try:
        data = request.json
        
        submitted_photo_path = data.get('submittedPhotoPath')
        reference_photo_path = data.get('referencePhotoPath')
        submitted_location = data.get('submittedLocation')  # {lat, lng}
        reference_location = data.get('referenceLocation')  # [lng, lat]
        verification_radius = data.get('verificationRadius', GPS_VERIFICATION_RADIUS)
        reference_metadata = data.get('referenceMetadata', {})
        
        if not all([submitted_photo_path, reference_photo_path, submitted_location, reference_location]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Initialize verification results
        results = {
            'passed': False,
            'score': 0,
            'details': {},
            'rejectionReason': None
        }
        
        # 1. GPS Verification
        gps_check = verify_gps(
            submitted_location,
            {'lat': reference_location[1], 'lng': reference_location[0]},
            verification_radius
        )
        results['details']['gps'] = gps_check
        
        if not gps_check['passed']:
            results['rejectionReason'] = f"Location outside valid area ({gps_check['distance']:.0f}m away)"
            return jsonify(results)
        
        # 2. EXIF Data Check
        exif_check = verify_exif(submitted_photo_path)
        results['details']['exif'] = exif_check
        
        if exif_check['warnings']:
            results['details']['exif_warnings'] = exif_check['warnings']
        
        # 3. Visual Verification
        visual_check = verify_visual_similarity(
            submitted_photo_path,
            reference_photo_path,
            reference_metadata
        )
        results['details']['visual'] = visual_check
        
        if not visual_check['passed']:
            results['rejectionReason'] = visual_check['reason']
            return jsonify(results)
        
        # Calculate overall score (weighted average)
        results['score'] = calculate_overall_score(gps_check, visual_check)
        results['passed'] = results['score'] >= 70
        
        if not results['passed']:
            results['rejectionReason'] = f"Overall verification score too low ({results['score']:.1f}/100)"
        
        return jsonify(results)
        
    except Exception as e:
        app.logger.error(f"Verification error: {str(e)}")
        return jsonify({'error': f'Verification failed: {str(e)}'}), 500


def verify_gps(submitted_loc, reference_loc, max_distance):
    """
    Verify GPS location is within acceptable radius
    """
    distance = haversine_distance(
        submitted_loc['lat'],
        submitted_loc['lng'],
        reference_loc['lat'],
        reference_loc['lng']
    )
    
    passed = distance <= max_distance
    
    return {
        'passed': passed,
        'distance': distance,
        'maxDistance': max_distance,
        'score': max(0, 100 - (distance / max_distance * 100)) if distance <= max_distance * 2 else 0
    }


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates in meters
    """
    R = 6371000  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def verify_exif(image_path):
    """
    Extract and verify EXIF data from submitted photo
    """
    warnings = []
    
    try:
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f, details=False)
        
        # Check if EXIF exists
        if not tags:
            warnings.append('No EXIF data found')
        
        # Check for GPS data
        has_gps = 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags
        
        # Check timestamp
        timestamp_tag = tags.get('EXIF DateTimeOriginal') or tags.get('Image DateTime')
        if timestamp_tag:
            # Verify photo is recent (within last hour for strict checking)
            # In production, you might want to be more lenient
            pass
        else:
            warnings.append('No timestamp in EXIF')
        
        # Check for manipulation signs
        if 'Image Software' in tags:
            software = str(tags['Image Software'])
            if any(editor in software.lower() for editor in ['photoshop', 'gimp', 'lightroom']):
                warnings.append(f'Photo may have been edited ({software})')
        
        return {
            'hasExif': bool(tags),
            'hasGPS': has_gps,
            'warnings': warnings,
            'metadata': {k: str(v) for k, v in list(tags.items())[:10]}  # Limited metadata
        }
        
    except Exception as e:
        return {
            'hasExif': False,
            'hasGPS': False,
            'warnings': [f'EXIF read error: {str(e)}'],
            'metadata': {}
        }


def verify_visual_similarity(submitted_path, reference_path, reference_metadata):
    """
    Multi-stage visual verification pipeline
    """
    try:
        # Load images
        submitted_img = cv2.imread(submitted_path)
        reference_img = cv2.imread(reference_path)
        
        if submitted_img is None or reference_img is None:
            return {
                'passed': False,
                'reason': 'Failed to load images',
                'phash_score': 0,
                'ssim_score': 0,
                'keypoint_matches': 0
            }
        
        # Stage 1: Perceptual Hash (pHash) - Quick similarity check
        phash_similarity = calculate_phash_similarity(submitted_path, reference_path)
        
        # Stage 2: SSIM (Structural Similarity Index)
        ssim_score = calculate_ssim(submitted_img, reference_img)
        
        # Stage 3: Feature matching (ORB keypoints)
        keypoint_matches = match_keypoints(submitted_img, reference_img)
        
        # Determine if passed
        passed = (
            phash_similarity >= MIN_PHASH_SIMILARITY or
            (ssim_score >= MIN_SSIM_SCORE and keypoint_matches >= MIN_KEYPOINT_MATCHES)
        )
        
        # Calculate visual score
        visual_score = (
            phash_similarity * 0.3 +
            ssim_score * 100 * 0.4 +
            min(keypoint_matches / 50 * 100, 100) * 0.3
        )
        
        reason = None
        if not passed:
            if phash_similarity < MIN_PHASH_SIMILARITY:
                reason = f"Photo doesn't match reference angle (similarity: {phash_similarity:.1f}%)"
            elif ssim_score < MIN_SSIM_SCORE:
                reason = f"Structural similarity too low ({ssim_score:.2f})"
            elif keypoint_matches < MIN_KEYPOINT_MATCHES:
                reason = f"Not enough matching features ({keypoint_matches} found)"
        
        return {
            'passed': passed,
            'reason': reason,
            'score': visual_score,
            'phash_score': phash_similarity,
            'ssim_score': ssim_score,
            'keypoint_matches': keypoint_matches
        }
        
    except Exception as e:
        return {
            'passed': False,
            'reason': f'Visual verification error: {str(e)}',
            'score': 0,
            'phash_score': 0,
            'ssim_score': 0,
            'keypoint_matches': 0
        }


def calculate_phash_similarity(img1_path, img2_path):
    """
    Calculate perceptual hash similarity (0-100%)
    """
    try:
        hash1 = imagehash.phash(Image.open(img1_path))
        hash2 = imagehash.phash(Image.open(img2_path))
        
        # Hash difference (0 = identical, higher = more different)
        hash_diff = hash1 - hash2
        
        # Convert to similarity percentage (assuming max diff of 64 for 8x8 hash)
        similarity = max(0, (64 - hash_diff) / 64 * 100)
        
        return similarity
    except Exception as e:
        app.logger.error(f"pHash error: {str(e)}")
        return 0


def calculate_ssim(img1, img2):
    """
    Calculate Structural Similarity Index
    """
    try:
        # Resize images to same dimensions
        height = min(img1.shape[0], img2.shape[0])
        width = min(img1.shape[1], img2.shape[1])
        
        img1_resized = cv2.resize(img1, (width, height))
        img2_resized = cv2.resize(img2, (width, height))
        
        # Convert to grayscale
        gray1 = cv2.cvtColor(img1_resized, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2_resized, cv2.COLOR_BGR2GRAY)
        
        # Calculate SSIM
        score, _ = ssim(gray1, gray2, full=True)
        
        return score
    except Exception as e:
        app.logger.error(f"SSIM error: {str(e)}")
        return 0


def match_keypoints(img1, img2):
    """
    Match ORB keypoints between images
    """
    try:
        # Convert to grayscale
        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
        
        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=500)
        
        # Detect keypoints and descriptors
        kp1, des1 = orb.detectAndCompute(gray1, None)
        kp2, des2 = orb.detectAndCompute(gray2, None)
        
        if des1 is None or des2 is None:
            return 0
        
        # Create BFMatcher
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        # Match descriptors
        matches = bf.match(des1, des2)
        
        # Sort by distance
        matches = sorted(matches, key=lambda x: x.distance)
        
        # Count good matches (distance < threshold)
        good_matches = [m for m in matches if m.distance < 50]
        
        return len(good_matches)
    except Exception as e:
        app.logger.error(f"Keypoint matching error: {str(e)}")
        return 0


def calculate_overall_score(gps_check, visual_check):
    """
    Calculate weighted overall verification score
    """
    gps_weight = 0.3
    visual_weight = 0.7
    
    overall = (
        gps_check['score'] * gps_weight +
        visual_check['score'] * visual_weight
    )
    
    return round(overall, 2)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
