provision:
	@cd src; \
	npm install; \
	npx webpack --config './webpack.config.js' --mode production;

watch:
	@cd src; \
 	npx webpack --config './webpack.config.js' --watch --progress;