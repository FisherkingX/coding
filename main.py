from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Dictionary to track actual users in rooms
room_users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    if room not in room_users: room_users[room] = set()
    room_users[room].add(request.sid)
    emit('update_room_count', len(room_users[room]), room=room)

@socketio.on('disconnect')
def on_disconnect():
    for room, users in room_users.items():
        if request.sid in users:
            users.remove(request.sid)
            emit('update_room_count', len(users), room=room)

@socketio.on('message')
def handle_message(data):
    emit('render_msg', data, room=data['room'])

@socketio.on('request_action')
def handle_request(data):
    emit('incoming_request', data, room=data['room'], include_self=False)

@socketio.on('respond_action')
def handle_response(data):
    emit('action_response', data, room=data['room'], include_self=False)
from flask import send_from_directory
app = Flask(__name__)

@app.route('/icon.png') 
def serve_icon():
    return
send_from_directory('static','icon.png')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)

