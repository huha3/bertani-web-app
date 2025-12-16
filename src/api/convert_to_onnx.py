import tf2onnx
import tensorflow as tf

keras_model_path = "src/api/model/Model_CNN_256px.keras"
keras_model = tf.keras.models.load_model(keras_model_path)

spec = (tf.TensorSpec(keras_model.input_shape, tf.float32, name="input"),)
import pathlib
onnx_model_path = pathlib.Path("src/api/model/Model_CNN_256px.onnx")

model_proto, _ = tf2onnx.convert.from_keras(
    keras_model,
    input_signature=spec,
    opset=17,
    output_path=str(onnx_model_path)
)

print(f"ONNX model berhasil dibuat: {onnx_model_path.resolve()}")
