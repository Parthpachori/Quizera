from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from flask_session import Session
import os
import json
import uuid
import google.generativeai as genai
from pypdf import PdfReader
import tempfile
from datetime import datetime

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = "quizera_secret_key"
Session(app)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyDFkcMl2cum5zknDn4X2S347eY8B2ug1EU"
genai.configure(api_key=GEMINI_API_KEY)

# Define the model
model = genai.GenerativeModel('gemini-1.5-pro')

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Dictionary to store PDF data
pdf_storage = {}

# Add route to serve your main page
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# Add route to serve all static files
@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory('.', filename)
    except FileNotFoundError:
        return "File not found", 404

# Test route to verify server is working
@app.route('/test')
def test():
    return jsonify({"message": "Server is working!", "status": "success"})

@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    pdf_file = request.files['pdf']

    if pdf_file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Generate a unique ID for this PDF
        pdf_id = str(uuid.uuid4())

        # Extract text from PDF
        pdf_text = extract_text_from_pdf(pdf_file)

        # Save PDF information
        pdf_storage[pdf_id] = {
            'filename': pdf_file.filename,
            'text': pdf_text,
            'upload_time': datetime.now().isoformat()
        }

        # Save the PDF file to the uploads directory
        pdf_path = os.path.join(UPLOAD_FOLDER, f"{pdf_id}.pdf")
        pdf_file.seek(0)  # Reset file pointer after reading
        pdf_file.save(pdf_path)

        return jsonify({
            "message": "PDF uploaded successfully",
            "pdf_id": pdf_id,
            "filename": pdf_file.filename
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    # Check if we're using a PDF ID or a direct file upload
    pdf_id = request.form.get('pdf_id')
    pdf_text = None

    if pdf_id and pdf_id in pdf_storage:
        # Use the stored PDF text
        pdf_text = pdf_storage[pdf_id]['text']
    elif 'pdf' in request.files:
        # Extract text from the uploaded PDF
        pdf_file = request.files['pdf']
        pdf_text = extract_text_from_pdf(pdf_file)
    else:
        return jsonify({"error": "No PDF provided (neither ID nor file)"}), 400

    quiz_type = request.form.get('quiz_type', '1')  # Default to MCQs
    difficulty = request.form.get('difficulty', '2')  # Default to Medium
    num_questions = request.form.get('num_questions', 5, type=int)

    # Map quiz type to description
    quiz_types = {
        "1": "Multiple Choice Questions (MCQs)",
        "2": "Fill in the blanks",
        "3": "True/False questions",
        "4": "Short answer questions",
        "5": "Long answer questions",
        "6": "Mix of all question types"
    }

    # Map difficulty to description
    difficulties = {
        "1": "Easy",
        "2": "Medium",
        "3": "Hard"
    }

    selected_quiz_type = quiz_types.get(quiz_type, quiz_types["1"])
    selected_difficulty = difficulties.get(difficulty, difficulties["2"])

    try:
        # Store in session for future reference
        session['last_pdf_text'] = pdf_text

        # Generate quiz using Gemini
        quiz = generate_quiz_with_gemini(pdf_text, selected_quiz_type, selected_difficulty, num_questions)

        return jsonify(quiz)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_text_from_pdf(pdf_file):
    # Save the uploaded file to a temporary location
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    pdf_file.save(temp_file.name)
    temp_file.close()

    try:
        # Extract text from the PDF
        reader = PdfReader(temp_file.name)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    finally:
        # Clean up the temporary file
        os.unlink(temp_file.name)

def generate_quiz_with_gemini(text, quiz_type, difficulty, num_questions):
    # Truncate text if it's too long
    max_length = 30000
    if len(text) > max_length:
        text = text[:max_length] + "...[text truncated due to length]"

    # Create the prompt for Gemini
    prompt = f"""
    You are an educational quiz generator. Based on the following text, create a quiz with {num_questions} questions.

    Quiz type: {quiz_type}
    Difficulty level: {difficulty}

    Text from PDF:
    {text}

    Instructions:
    1. Generate exactly {num_questions} questions based on the content.
    2. Make sure all questions and answers are directly from the PDF content.
    3. Do not make up information that is not in the PDF.
    4. Format the output as a JSON object with the following structure:
       {{
         "questions": [
           {{
             "question": "Question text here",
             "options": ["Option A", "Option B", "Option C", "Option D"],  // Only for MCQs and True/False
             "answer": "Correct answer here",
             "explanation": "Brief explanation of the answer with reference to the PDF content"
           }},
           // More questions...
         ]
       }}
    5. For different question types:
       - MCQs: Include 4 options with one correct answer. The correct answer must be one of the options.
       - Fill in the blanks: Use "_____" to indicate the blank and provide the exact answer from the PDF.
       - True/False: Make the question a statement and answer should be "True" or "False". Include options ["True", "False"].
       - Short answer: Question should be answerable in 1-2 sentences with information directly from the PDF.
       - Long answer: Question should require detailed explanation using information from the PDF.
       - Mix: Include a balanced mix of all question types.
    6. Adjust difficulty according to the specified level:
       - Easy: Basic recall questions with obvious answers
       - Medium: Questions requiring understanding of concepts
       - Hard: Questions requiring deeper analysis or synthesis of information

    Return ONLY the JSON object with no additional text.
    """

    # Call Gemini API
    response = model.generate_content(prompt)

    # Extract and parse the JSON response
    try:
        # Clean the response text to ensure it's valid JSON
        response_text = response.text
        # Find JSON content (in case there's any preamble text)
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_content = response_text[json_start:json_end]
            quiz_data = json.loads(json_content)

            # Process the quiz data to ensure it's in the correct format
            processed_quiz = process_quiz_data(quiz_data, quiz_type)
            return processed_quiz
        else:
            # If no JSON found, try to parse the whole response
            quiz_data = json.loads(response_text)
            processed_quiz = process_quiz_data(quiz_data, quiz_type)
            return processed_quiz
    except json.JSONDecodeError as e:
        # If parsing fails, return the raw response for debugging
        return {
            "error": "Failed to parse quiz data",
            "raw_response": response.text,
            "json_error": str(e)
        }

def process_quiz_data(quiz_data, quiz_type):
    """Process the quiz data to ensure it's in the correct format"""
    if 'questions' not in quiz_data:
        return {"questions": []}

    processed_questions = []

    for question in quiz_data['questions']:
        processed_question = {
            "question": question.get('question', ''),
            "answer": question.get('answer', ''),
            "explanation": question.get('explanation', '')
        }

        # Handle options for MCQs and True/False
        if 'options' in question:
            processed_question['options'] = question['options']

            # For MCQs, ensure the answer is one of the options
            if quiz_type in ["1", "Multiple Choice Questions (MCQs)"]:
                if processed_question['answer'] not in processed_question['options']:
                    # Find the closest option to the answer
                    closest_option = find_closest_option(processed_question['answer'], processed_question['options'])
                    processed_question['answer'] = closest_option

            # For True/False, ensure options are ["True", "False"]
            if quiz_type in ["3", "True/False questions"]:
                processed_question['options'] = ["True", "False"]
                processed_question['answer'] = "True" if processed_question['answer'].lower() == "true" else "False"

        # For fill in the blanks, ensure the question has a blank
        if quiz_type in ["2", "Fill in the blanks"] and "_____" not in processed_question['question']:
            processed_question['question'] = processed_question['question'].replace("_", "_____")

        processed_questions.append(processed_question)

    return {"questions": processed_questions}

def find_closest_option(answer, options):
    """Find the option that is closest to the answer"""
    # Simple implementation: return the first option if no match
    # In a real implementation, you might use string similarity metrics
    return options[0]

if __name__ == '__main__':
    print("Starting QUIZERA server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    app.run(host='127.0.0.1', port=5000, debug=True)

