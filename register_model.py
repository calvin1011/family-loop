import mlflow

logged_model_path = "ai/message_model"
model_name = "FamilyMessageModel"

mlflow.set_tracking_uri("file:///home/jovyan/mlruns")

result = mlflow.register_model(
    model_uri=logged_model_path,
    name=model_name
)

print(f"Model registered as: {result.name} version {result.version}")
