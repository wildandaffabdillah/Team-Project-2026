def check_violation(predictions):
    helmet = False
    vest = False
    person = False

    for p in predictions:
        if p["class"] == "helmet":
            helmet = True
        if p["class"] == "vest":
            vest = True
        if p["class"] == "person":
            person = True

    violation = person and (not helmet or not vest)

    return person, helmet, vest, violation