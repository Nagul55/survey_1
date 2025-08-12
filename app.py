from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
import json
from urllib.parse import quote, unquote
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///survey.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Response(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_details = db.Column(db.Text)
    answers = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

with open('Questions.json', 'r', encoding='utf-8') as f:
    all_questions = json.load(f)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        user_details = {
            'name': request.form.get('name'),
            'register_number': request.form.get('register_number'),
            'college': request.form.get('college'),
            'location': request.form.get('location'),
        }
        language = request.form.get('language', 'en')
        session['user_details'] = user_details
        session['language'] = language
        return redirect(url_for('survey'))
    return render_template('index.html')

@app.route('/survey')
def survey():
    language = session.get('language', 'en')
    return render_template('survey.html', questions=all_questions, language=language)

@app.route('/review', methods=['POST'])
def review():
    answers = request.form.to_dict()
    session['answers'] = answers
    return render_template('review.html', questions=all_questions, answers=answers)

@app.route('/submit', methods=['POST'])
def submit():
    user_details = session.get('user_details', {})
    answers = session.get('answers', {})
    session.clear()
    new_response = Response(
        user_details=json.dumps(user_details),
        answers=json.dumps(answers)
    )
    db.session.add(new_response)
    db.session.commit()
    return redirect(url_for('thankyou', details=quote(json.dumps(user_details)), answers=quote(json.dumps(answers))))

@app.route('/thankyou')
def thankyou():
    user_details = json.loads(unquote(request.args.get('details', '{}')))
    answers = json.loads(unquote(request.args.get('answers', '{}')))
    return render_template('thankyou.html', user_details=user_details, questions=all_questions, answers=answers)

@app.route('/responses')
def responses():
    all_responses = Response.query.all()
    parsed_responses = []
    for resp in all_responses:
        try:
            details = json.loads(resp.user_details) if resp.user_details else {}
            answers = json.loads(resp.answers) if resp.answers else {}
        except json.JSONDecodeError:
            details = {}
            answers = {}
        parsed_responses.append({
            'id': resp.id,
            'submitted_at': resp.submitted_at,
            'details': details,
            'answers': answers
        })
    return render_template('responses.html', responses=parsed_responses)

if __name__ == '__main__':
    app.run(debug=True)
