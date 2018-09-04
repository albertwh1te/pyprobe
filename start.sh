#!/bin/bash
virtualenv pyprobe_env -p python3
source pyprobe_env/bin/activate
pip install -r requirements.txt
python server.py
