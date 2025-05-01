import mlflow.pyfunc
import pandas as pd
from message_generator import generate_message

class MessageModel(mlflow.pyfunc.PythonModel):
    def predict(self, context, model_input):
        results = []
        for _, row in model_input.iterrows():
            msg = generate_message(
                name=row["name"],
                relationship=row["relationship"],
                tone=row["tone"],
                days_since_contact=row["days_since_contact"]
            )
            results.append(msg)
        return results

if __name__ == "__main__":
    model = MessageModel()
    conda_env = {
        "name": "mlflow-env",
        "channels": ["defaults"],
        "dependencies": [
            "python=3.8",
            "pip",
            {"pip": ["mlflow", "pandas"]}
        ]
    }
    mlflow.pyfunc.save_model(
        path="message_model",
        python_model=model,
        conda_env=conda_env
    )
