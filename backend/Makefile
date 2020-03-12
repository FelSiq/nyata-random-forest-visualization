run:
	export FLASK_ENV=development && \
	export FLASK_APP=model_dt && \
	export FLASK_DEBUG=1 && \
	export SESSION_TYPE=redis && \
	export SESSION_USE_SIGNER=1 && \
	export SESSION_REDIS='redis://127.0.0.1:6379' && \
	export SECRET_KEY='e\x83\x12\x99&\x17\x1a\x142\xf2\xb8\xcd"\x97\x1c\x84`\x147\x86F\xd4\x10p' && \
	export SESSION_PERMANENT=0 && \
	flask run

install:
	pip install -Ur model_dt/requirements.txt
	sudo apt-get install redis-server
