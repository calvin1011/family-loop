import mlflow
import os

# Get the absolute path to the model directory
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, "family-loop/ai/message_model")

# Set model name
model_name = "FamilyMessageModel"

# Set MLflow tracking URI
# mlflow.set_tracking_uri("file:///home/jovyan/mlruns")

print(f"Registering model from path: {model_dir}")

# Register the model
try:
    result = mlflow.register_model(
        model_uri=f"file://{model_dir}",
        name=model_name
    )
    print(f"Model registered successfully as: {result.name} version {result.version}")
    print(f"Use this information for deployment.")
except Exception as e:
    print(f"Error registering model: {str(e)}")
    print("Troubleshooting tips:")
    print("1. Make sure the model directory exists and contains all required files")
    print("2. Check that the MLflow tracking URI is correct")
    print("3. Ensure you have the right permissions to register models")