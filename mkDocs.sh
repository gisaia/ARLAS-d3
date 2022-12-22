#!/bin/sh -e

## CREATE TARGET DIRECTORY ##
rm -rf target
mkdir target
mkdir target/generated-docs

## GENERATE THE DOCUMENTATION ##
docker run -a STDERR --rm -i -v `pwd`:/docs gisaia/typedocgen:0.0.7 generatedoc src

## MOVE ALL THE DOCUMENTATION TO THE 'generated-docs' FOLDER ##
if [ -z "$(ls -A ./typedoc_docs)" ]; then
   echo "Documentation has not been generated"
else
   mv typedoc_docs/* target/generated-docs
   cp CHANGELOG.md target/generated-docs/CHANGELOG_ARLAS-d3.md
fi
if [ -d ./docs ] ; then
    cp -r docs/* target/generated-docs
fi

