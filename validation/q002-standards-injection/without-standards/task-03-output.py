# Task 3: Data Processing Pipeline (WITHOUT STANDARDS)

from datetime import datetime

REQUIRED_FIELDS = ["name", "email", "date"]

def processRecords(records):
    """Process a list of records"""
    processed = []
    errors = []

    for i, record in enumerate(records):
        # Check required fields
        missing = [f for f in REQUIRED_FIELDS if f not in record]
        if missing:
            errors.append({"index": i, "error": f"Missing fields: {missing}"})
            continue

        try:
            # Transform record
            newRecord = {
                "name": record["name"].strip().title(),
                "email": record["email"].lower().strip(),
                "date": datetime.strptime(record["date"], "%Y-%m-%d"),
                "processed": True
            }
            processed.append(newRecord)
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    return processed, errors


def validateAndProcess(data):
    if not isinstance(data, list):
        return [], [{"error": "Input must be a list"}]
    return processRecords(data)
