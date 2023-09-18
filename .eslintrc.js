module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: ["xo", "plugin:prettier/recommended"],
	overrides: [
		{
			extends: ["xo-typescript", "plugin:prettier/recommended"],
			files: ["*.ts", "*.tsx"],
			rules: {
				"no-new": "off",
				"@typescript-eslint/naming-convention": "off",
				"@typescript-eslint/no-unsafe-argument": "off",
				"@typescript-eslint/ban-ts-comment": "off",
				"@typescript-eslint/consistent-type-imports": "off",
				"@typescript-eslint/no-unsafe-call": "off",
				"@typescript-eslint/no-unsafe-assignment": "off",
				"@typescript-eslint/restrict-template-expressions": "off",
				"@typescript-eslint/consistent-type-definitions": "off",
				"no-mixed-spaces-and-tabs": "off",
			},
		},
	],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	rules: {
		"@typescript-eslint/consistent-type-imports": "off",
	},
};
