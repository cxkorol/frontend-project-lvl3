lint: 
	npx eslint .

develop:
	npx webpack-dev-server --hot --inline

build: 
	rm -rf dist
	NODE_ENV=production npx webpack

publish:
	npm publish

deploy: 
	make build
	surge ./dist --domain kor-newsfeed-rss.surge.sh

