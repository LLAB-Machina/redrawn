const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../../api/openapi.json');
const outPath = path.resolve(__dirname, '../openapi.client.json');

const spec = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));

if (spec.paths && typeof spec.paths === 'object') {
	for (const pathKey of Object.keys(spec.paths)) {
		const pathItem = spec.paths[pathKey];
		for (const methodKey of Object.keys(pathItem)) {
			const op = pathItem[methodKey];
			if (op && Array.isArray(op.parameters)) {
				op.parameters = op.parameters.filter(
					(p) => !(p && p.in === 'header' && p.name === 'Accept')
				);
			}
		}
	}
}

fs.writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log('Wrote cleaned OpenAPI to', outPath);

