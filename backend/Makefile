run:
	export FLASK_ENV=development && \
	export FLASK_APP=nyata && \
	export SESSION_TYPE=redis && \
	export SESSION_REDIS='redis://127.0.0.1:6379' && \
	export SESSION_PERMANENT=0 && \
	export FLASK_DEBUG=1 && \
	python -m flask run
	# export SESSION_USE_SIGNER=1
	# export SECRET_KEY='e\x83\x12\x99&\x17\x1a\x142\xf2\xb8\xcd"\x97\x1c\x84`\x147\x86F\xd4\x10p'

install-apt:
	python -m pip install -Ur requirements.txt
	sudo apt install redis-server

install-apt-get:
	python -m pip install -Ur requirements.txt
	sudo apt-get install redis-server

install-yay:
	python -m pip install -Ur requirements.txt
	yay -S redis
	systemctl start redis.service
	systemctl enable redis.service

install-pacman:
	python -m pip install -Ur requirements.txt
	pacman -S redis
	systemctl start redis.service
	systemctl enable redis.service
