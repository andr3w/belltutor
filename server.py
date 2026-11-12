#!/usr/bin/env python3
"""The learning site at pullrope.net.

No login, and nothing here is anyone's to lose: the page is a teaching aid that keeps
its state in the browser and writes nothing. The recording app, which does hold
people's audio and can write to the database, stays behind its password at
dev.pullrope.net and is a separate app in a separate directory.
"""
from flask import Flask, render_template, send_from_directory
import time
app = Flask(__name__)
V = str(int(time.time()))

@app.context_processor
def inject_v():
  return {'v': V}

@app.route('/')
def index():
  return render_template('index.html')

# Both are served from the root rather than /static: a service worker can only control
# pages under its own path, and the manifest's scope has to match.
@app.route('/sw.js')
def service_worker():
  return send_from_directory('static', 'sw.js', mimetype='application/javascript')

@app.route('/manifest.json')
def manifest():
  return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')
