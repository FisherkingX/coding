from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
# Ensure async_mode is set explicitly for Gunicorn/Eventlet
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

room_users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def on_join(data):
    try:
        room = data.get('room')
        if not room: return
        join_room(room)
        if room not in room_users: room_users[room] = set()
        room_users[room].add(request.sid)
        emit('update_room_count', len(room_users[room]), room=room)
    except Exception as e:
        print(f"Error in join: {e}")

@socketio.on('disconnect')
def on_disconnect():
    for room, users in room_users.items():
        if request.sid in users:
            users.remove(request.sid)
            emit('update_room_count', len(users), room=room)

@socketio.on('message')
def handle_message(data):
    # Ensure the room key exists to prevent KeyError crashes
    room = data.get('room')
    if room:
        emit('render_msg', data, room=room)

@socketio.on('request_action')
def handle_request(data):
    room = data.get('room')
    if room:
        emit('incoming_request', data, room=room, include_self=False)

@socketio.on('respond_action')
def handle_response(data):
    room = data.get('room')
    if room:
        emit('action_response', data, room=room, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)