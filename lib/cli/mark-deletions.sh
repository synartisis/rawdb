deletedPath=.rawdb/deleted/

find . -type f -not -path "./.rawdb/*" > .rawdb/index-new

for f in "`diff .rawdb/index .rawdb/index-new | grep '< ' | sed 's/< //'`";
do
  echo "${f}";
  mkdir -p `dirname '"${deletedPath}${f}"'`;
  touch "${deletedPath}${f}";
done

rm .rawdb/index;
mv .rawdb/index-new .rawdb/index