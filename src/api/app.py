from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import requests
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Load model
model = load_model('model/Model_CNN_256px.keras')

# Class labels
class_labels = {
    0: 'Bercak Daun (Leaf Spot)',
    1: 'Hawar Daun (Blight)',
    2: 'Karat Daun (Rust)',
    3: 'Sehat (Healthy)'
}

# Deskripsi dan saran untuk setiap penyakit
disease_info = {
    'Bercak Daun (Leaf Spot)': {
        'tingkat': 'sedang',
        'deskripsi': 'Bercak daun disebabkan oleh berbagai patogen jamur seperti Cercospora zeae-maydis. Ditandai dengan bercak-bercak kecil berbentuk oval atau bulat dengan tepi berwarna lebih gelap.',
        'saran': 'Aplikasi fungisida kontak seperti klorotalonil atau mankozeb \nSemprot pada pagi atau sore hari untuk hasil optimal \nPemupukan berimbang NPK untuk menjaga kesehatan tanaman \nSanitasi lahan dengan membersihkan sisa tanaman \nGunakan mulsa untuk mencegah percikan air hujan \nTingkatkan pemupukan nitrogen secara bertahap'
    },
    'Hawar Daun (Blight)': {
        'tingkat': 'berat',
        'deskripsi': 'Hawar daun adalah penyakit yang disebabkan oleh jamur Exserohilum turcicum. Penyakit ini ditandai dengan bercak memanjang berwarna coklat keabu-abuan pada daun. Dapat menyebabkan penurunan hasil hingga 30-50% jika tidak ditangani.',
        'saran': 'Segera lakukan penyemprotan fungisida berbahan aktif mankozeb atau azoksistrobin \nAplikasi setiap 7-10 hari selama 3-4 kali berturut-turut \nBuang dan bakar daun yang terinfeksi parah \nPerbaiki drainase lahan untuk mengurangi kelembaban \nGunakan varietas tahan penyakit untuk musim tanam berikutnya \nRotasi tanaman dengan kedelai atau kacang tanah'
    },
    'Karat Daun (Rust)': {
        'tingkat': 'ringan',
        'deskripsi': 'Karat daun disebabkan oleh jamur Puccinia sorghi. Gejalanya berupa pustula kecil berwarna coklat kemerahan pada permukaan daun. Penyakit ini lebih sering muncul saat kelembaban tinggi.',
        'saran': 'Semprot fungisida sistemik berbahan aktif propikonazol \nTingkatkan sirkulasi udara dengan mengatur jarak tanam \nHindari penyiraman berlebihan pada daun \nAplikasi pupuk kalium untuk meningkatkan ketahanan tanaman \nMonitor secara rutin setiap 3-4 hari \nTanam varietas tahan karat untuk pencegahan'
    },
    'Sehat (Healthy)': {
        'tingkat': 'sehat',
        'deskripsi': 'Tanaman jagung dalam kondisi sehat dan normal. Daun berwarna hijau segar tanpa gejala penyakit. Pertumbuhan optimal dan produktivitas maksimal dapat dicapai dengan perawatan rutin.',
        'saran': 'Pertahankan pemupukan rutin dengan NPK sesuai dosis anjuran \nLakukan penyiraman teratur terutama saat fase vegetatif \nMonitor secara berkala untuk deteksi dini penyakit \nLakukan penyiangan gulma setiap 2-3 minggu \nAplikasi pupuk organik untuk menjaga kesuburan tanah \nPastikan drainase lahan baik untuk mencegah genangan'
    }
}

def preprocess_image(image_url):
    """Download dan preprocess gambar dari URL"""
    print("Menguji URL:", image_url)
    response = requests.get(image_url)
    print("Status code:", response.status_code)
    print("Content length:", len(response.content))
    if response.status_code != 200:
        raise Exception(f"Gagal mengunduh gambar dari URL: {image_url}")

    img = Image.open(BytesIO(response.content)).convert("RGB")
    img = img.resize((256, 256))  # Sesuai model
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route('/api/model', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or "image_url" not in data:
            return jsonify({"error": "image_url missing"}), 400

        image_url = data["image_url"]

        # Preprocess gambar dari URL
        img_array = preprocess_image(image_url)

        # Predict
        predictions = model.predict(img_array)
        class_idx = np.argmax(predictions[0])
        akurasi = float(predictions[0][class_idx]) * 100

        disease_name = class_labels[class_idx]
        info = disease_info[disease_name]

        return jsonify({
            'success': True,
            'nama_penyakit': disease_name,
            'akurasi': round(akurasi, 2),
            'tingkat_keparahan': info['tingkat'],
            'saran': info['saran'],
            'deskripsi': info['deskripsi'], 
            'image_url': image_url
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'CNN 256px loaded'})

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)

