def generate_message(name, relationship, tone, days_since_contact):
    if days_since_contact > 30:
        opener = "It's been a while!"
    elif days_since_contact > 14:
        opener = "Just checking in."
    else:
        opener = "Thinking of you."

    if tone == "warm":
        body = f"Hey {name}, {opener} I hope everything is going great."
    elif tone == "casual":
        body = f"Hey {name}, {opener} How's it going?"
    elif tone == "playful":
        body = f"Yo {name}! {opener} What’s new?"
    else:
        body = f"Hi {name}, {opener} Wanted to reach out."

    return body