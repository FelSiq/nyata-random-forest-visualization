if [[ $# -eq 0 ]]
then
	echo "Please provide your package manager: 'apt', 'apt-get', 'yay' or 'pacman'.
If your package manager isn't in this list, then please open backend/Makefile and provide the dependency installation commands yourself."
	exit 1
fi

make -C ./backend install-"$1"
cd ./frontend/model-dt
npm install frontend/model-dt
npm audit fix
cd ../
