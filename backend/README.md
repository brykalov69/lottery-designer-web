# LotteryDesignerWeb

Lottery system designer with:
- smart generator
- history loader (TXT/CSV)
- statistics & analytics
- AI Insights (global + per-ball)

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
