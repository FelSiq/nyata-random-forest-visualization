make -C frontend &
PID_FRONTEND=$!
make -C backend
kill $PID_FRONTEND
