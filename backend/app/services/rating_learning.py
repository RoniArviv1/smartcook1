from app.models import RecipeRating
from sqlalchemy import desc

def summarize_user_ratings_for_prompt(user_id: int, max_items: int = 5) -> str:
    """
    מחלץ תקציר טעמים מתוך דירוגי משתמש – אילו מתכונים אהב ולא אהב.
    הטקסט שיווצר מיועד להישלח כחלק מה-prompt ל-AI.

    לדוגמה:
    "The user liked: Vegan Pasta, Lentil Soup. The user disliked: Chickpea Curry."

    :param user_id: מזהה המשתמש
    :param max_items: מספר מרבי של מתכונים מוצגים מכל קטגוריה (אהב / לא אהב)
    :return: טקסט תקציר באנגלית
    """
    # מתכונים עם דירוג גבוה
    liked = (
        RecipeRating.query
        .filter_by(user_id=user_id)
        .filter(RecipeRating.rating >= 4)
        .order_by(desc(RecipeRating.rating))
        .limit(max_items)
        .all()
    )

    # מתכונים עם דירוג נמוך
    disliked = (
        RecipeRating.query
        .filter_by(user_id=user_id)
        .filter(RecipeRating.rating <= 2)
        .order_by(RecipeRating.rating)
        .limit(max_items)
        .all()
    )

    # בניית התקציר
    summary = ""
    if liked:
        liked_titles = [r.title or "Unnamed Recipe" for r in liked]
        summary += "The user liked: " + ", ".join(liked_titles) + ".\n"
    if disliked:
        disliked_titles = [r.title or "Unnamed Recipe" for r in disliked]
        summary += "The user disliked: " + ", ".join(disliked_titles) + "."

    return summary.strip()
