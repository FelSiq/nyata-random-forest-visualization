if [[ $UID > 0 ]]
then
	echo "Warning: will may want to run this script in super-user mode."
fi

if [[ $# -eq 0 ]]
then
	echo "Please provide your package manager: 'apt', 'apt-get', 'yay' or 'pacman'."
	exit 1
fi

cd ./backend
make install-"$1"
cd ../frontend/model-dt
npm install
npm audit fix
cd ../../
