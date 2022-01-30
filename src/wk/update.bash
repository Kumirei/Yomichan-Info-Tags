cd /home/kumi/Documents/GitHub/"Yomichan WK + JLPT Tags"/
node ./src/wk/update.js
git add .
msg=`date`
msg="Automatic update "$msg
git commit -m "$msg"
git push origin