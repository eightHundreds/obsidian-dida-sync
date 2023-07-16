module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: 'xo',
	overrides: [
		{
			extends: [
				'xo-typescript',
			],
			files: [
				'*.ts',
				'*.tsx',
			],
			rules: {
				'no-new': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',
				'@typescript-eslint/indent': ['error', 2],
				'@typescript-eslint/consistent-type-imports': 'off',
				'@typescript-eslint/no-unsafe-call': 'off',
				'@typescript-eslint/no-unsafe-assignment': 'off',
				'@typescript-eslint/restrict-template-expressions': 'off',
			},
		},
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		'@typescript-eslint/consistent-type-imports': 'off',
	},
};
