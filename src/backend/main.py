from fastapi import FastAPI, UploadFile, File
import uvicorn
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io

app = FastAPI()

# Load model saat server start
model = load_model("model_corn_disease.h5")

# Kelas prediksi kamu (ubah sesuai model kamu)
class_names = ['blight', 'common_rust', 'gray_leaf_spot', 'healthy']

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))  # ganti sesuai input size model kamu
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    input_data = preprocess_image(image_bytes)
    predictions = model.predict(input_data)
    predicted_class = class_names[np.argmax(predictions)]
    return {"prediction": predicted_class}
