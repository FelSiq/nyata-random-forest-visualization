if [ $UID > 0 ]
then
	echo "Warning: will may want to run this script in super-user mode."
fi

cd ./backend
make install
cd ../frontend/model-dt
npm install
npm audit fix
cd ../../
