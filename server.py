from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from werkzeug.utils import secure_filename
from datetime import datetime

DB_FILE = 'data.sqlite'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=None)
CORS(app)  # allows requests from your frontend during development
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize DB/tables if they don't exist
def init_db():
    db = get_db()
    cur = db.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        location TEXT,
        date_found TEXT,
        finder_name TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT,
        created_at TEXT
    );
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        item_id TEXT,
        claimant_name TEXT,
        claimant_email TEXT,
        message TEXT,
        status TEXT,
        created_at TEXT
    );
    ''')
    db.commit()
    db.close()

init_db()

def row_to_dict(row):
    return dict(row) if row else None

@app.route('/api/items', methods=['GET'])
def get_items():
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT * FROM items ORDER BY created_at DESC')
    rows = cur.fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/items/approved', methods=['GET'])
def get_approved_items():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM items WHERE status = ? ORDER BY created_at DESC", ('approved',))
    rows = cur.fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json() or {}
    item_id = data.get('id') or str(int(datetime.utcnow().timestamp() * 1000))
    created_at = data.get('created_at') or datetime.utcnow().isoformat()
    fields = (
        item_id,
        data.get('name', ''),
        data.get('category', ''),
        data.get('location', ''),
        data.get('date_found', ''),
        data.get('finder_name', ''),
        data.get('description', ''),
        data.get('image_url', ''),
        data.get('status', 'pending'),
        created_at
    )
    db = get_db()
    cur = db.cursor()
    cur.execute('''
      INSERT INTO items (id,name,category,location,date_found,finder_name,description,image_url,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    ''', fields)
    db.commit()
    cur.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    return jsonify(row_to_dict(cur.fetchone()))

@app.route('/api/items/<item_id>/status', methods=['PUT'])
def update_item_status(item_id):
    data = request.get_json() or {}
    status = data.get('status')
    db = get_db()
    cur = db.cursor()
    cur.execute('UPDATE items SET status = ? WHERE id = ?', (status, item_id))
    db.commit()
    cur.execute('SELECT * FROM items WHERE id = ?', (item_id,))
    return jsonify(row_to_dict(cur.fetchone()))

@app.route('/api/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    db = get_db()
    cur = db.cursor()
    cur.execute('DELETE FROM items WHERE id = ?', (item_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/claims', methods=['GET'])
def get_claims():
    db = get_db()
    cur = db.cursor()
    cur.execute('SELECT * FROM claims ORDER BY created_at DESC')
    rows = cur.fetchall()
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/claims', methods=['POST'])
def create_claim():
    data = request.get_json() or {}
    claim_id = data.get('id') or str(int(datetime.utcnow().timestamp() * 1000))
    created_at = data.get('created_at') or datetime.utcnow().isoformat()
    fields = (
        claim_id,
        data.get('item_id', ''),
        data.get('claimant_name', ''),
        data.get('claimant_email', ''),
        data.get('message', ''),
        data.get('status', 'pending'),
        created_at
    )
    db = get_db()
    cur = db.cursor()
    cur.execute('''
      INSERT INTO claims (id,item_id,claimant_name,claimant_email,message,status,created_at)
      VALUES (?,?,?,?,?,?,?)
    ''', fields)
    db.commit()
    cur.execute('SELECT * FROM claims WHERE id = ?', (claim_id,))
    return jsonify(row_to_dict(cur.fetchone()))

@app.route('/api/claims/<claim_id>/status', methods=['PUT'])
def update_claim_status(claim_id):
    data = request.get_json() or {}
    status = data.get('status')
    db = get_db()
    cur = db.cursor()
    cur.execute('UPDATE claims SET status = ? WHERE id = ?', (status, claim_id))
    db.commit()
    cur.execute('SELECT * FROM claims WHERE id = ?', (claim_id,))
    return jsonify(row_to_dict(cur.fetchone()))

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    if filename == '':
        return jsonify({'error': 'Bad filename'}), 400
    timestamped = f"{int(datetime.utcnow().timestamp() * 1000)}-{filename}"
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], timestamped)
    file.save(save_path)
    public_url = f"{request.scheme}://{request.host}/uploads/{timestamped}"
    return jsonify({'publicUrl': public_url})

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Development server (not for production)
    app.run(host='0.0.0.0', port=4000, debug=True)
