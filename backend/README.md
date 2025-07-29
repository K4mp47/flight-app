

## Getting Started

If you haven't already installed it, install virtualenv.
```bash
#i use arch btw
sudo pacman -S python-virtualenv
```
Now move to the backend folder and type the command:
```bash
virtualenv venv
```
This will create the venv folder. Once this is done, we are ready to begin.

First, Activate the virtual environment:

```bash
source venv/bin/activate
# It is important to be in the backend folder.
```
Second, Install dependencies

```bash
pip install -r requirements.txt
```

Third, launch the application.
```bash
python app.py
```

[http://localhost:5000] is active, This will activate the APIs.

