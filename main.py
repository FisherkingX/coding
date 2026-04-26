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
    print(f"[JOIN] Room: {room}, Users: {len(room_users[room])}")
    emit('update_room_count', len(room_users[room]), room=room, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    for room, users in list(room_users.items()):
        if request.sid in users:
            users.remove(request.sid)
            leave_room(room)
            print(f"[DISCONNECT] Room: {room}, Users remaining: {len(users)}")
            emit('update_room_count', len(users), room=room, broadcast=True)
            if len(users) == 0:
                del room_users[room]

@socketio.on('message')
def handle_message(data):
    print(f"[MESSAGE] Room: {data['room']}, From: {data['name']}, Text: {data['text']}")
    emit('render_msg', data, room=data['room'], broadcast=True)

@socketio.on('request_action')
def handle_request(data):
    emit('incoming_request', data, room=data['room'], broadcast=True, include_self=False)

@socketio.on('respond_action')
def handle_response(data):
    emit('action_response', data, room=data['room'], broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)