const path = require('path')
const inquirer = require('inquirer')
const Initiator = require('./initiator')
const InitiatorConfig = require('./initiatorConfig')
const { basicHtml, basicCss, bulmaHtml, bulmaCss, bootstrapHtml, bootstrapCss, tailwindHtml } = require('./examples')

module.exports = async (dir) => {
  const initiatorConfig = new InitiatorConfig()
  const frontalMainAssets = []
  let frontalIndexBody = []

  // Choose initiation mode
  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Choose initiation mode',
      choices: [
        { name: 'Basic', value: 'basic' },
        { name: 'Custom', value: 'custom' },
      ],
    },
  ])

  const basicSetup = () => {
    initiatorConfig.addFile('assets/css/style.scss', basicCss)
    frontalMainAssets.push('@assets/css/style.scss')

    frontalIndexBody = basicHtml

    // In all cases, frontal.js requires at-least one .js asset
    initiatorConfig.addFile('assets/js/app.js', ['// @todo write your application code...'])
    frontalMainAssets.push('@assets/js/app.js')
  }

  // Define initiator options when mode is basic
  if (mode === 'basic') {
    basicSetup()
  }

  // Continue asking questions if mode is custom
  if (mode === 'custom') {
    const customInit = await inquirer.prompt([
      {
        type: 'list',
        name: 'cssFramework',
        message: 'Choose your CSS Framework',
        choices: [
          { name: 'None', value: false },
          { name: 'Bulma', value: 'bulma' },
          { name: 'Bootstrap', value: 'bootstrap' },
          { name: 'Bootstrap v5', value: 'bootstrap5' },
          { name: 'Tailwindcss', value: 'tailwindcss' },
        ],
      },
      {
        type: 'checkbox',
        name: 'devFeatures',
        message: 'Choose your development features',
        choices: [
          {
            name: 'Babel',
            value: 'babel',
            checked: true,
          },
          { name: 'Typescript', value: 'typescript' },
          { name: 'PostCSS', value: 'postcss' },
          {
            name: 'ESLint',
            value: 'eslint',
            checked: true,
          },
          {
            name: 'Stylelint',
            value: 'stylelint',
          },
        ],
      },
    ])

    switch (customInit.cssFramework) {
      case 'bulma':
        // Main bulma package
        initiatorConfig.addPackage('bulma', 'latest')

        // Assets
        frontalMainAssets.push('bulma')
        initiatorConfig.addFile('assets/style/main.scss', bulmaCss)
        frontalMainAssets.push('@assets/style/main.scss')

        // Initial bulma example HTML body
        frontalIndexBody = bulmaHtml
        break
      case 'bootstrap':
      case 'bootstrap5':
        initiatorConfig.addPackage('popper.js', 'latest')
        if (customInit.cssFramework === 'bootstrap5') {
          initiatorConfig.addPackage('bootstrap', 'next')
        } else {
          initiatorConfig.addPackage('jquery', 'latest')
          initiatorConfig.addPackage('bootstrap', '^4.5.3')
        }

        frontalMainAssets.push('bootstrap')
        frontalMainAssets.push('@assets/style/main.scss')

        initiatorConfig.addFile('assets/style/main.scss', bootstrapCss)
        frontalIndexBody = bootstrapHtml
        break
      case 'tailwindcss':
        initiatorConfig.addPackage('postcss', 'latest')
        initiatorConfig.addPackage('tailwindcss', 'latest')
        initiatorConfig.addPackage('autoprefixer', 'latest')

        initiatorConfig.addFile('postcss.config.js', [
          'module.exports = () => ({',
          '\tplugins: [',
          "\t\trequire('autoprefixer'),",
          "\t\trequire('tailwindcss')",
          '\t]',
          '});',
        ])
        initiatorConfig.addFile('tailwind.config.js', [
          'module.exports = {',
          "\tpurge: ['./pages/**/*.html'],",
          '\tdarkMode: false,',
          '\ttheme: {',
          '\t\textend: {},',
          '\t},',
          '\tvariants: {},',
          '\tplugins: [],',
          '}',
        ])

        frontalMainAssets.push('@assets/style/tailwind.scss')
        initiatorConfig.addFile('assets/style/tailwind.scss', [
          '@import "~tailwindcss/base";',
          '@import "~tailwindcss/components";',
          '@import "~tailwindcss/utilities";',
        ])

        frontalMainAssets.push('@assets/style/custom.scss')
        initiatorConfig.addFile('assets/style/custom.scss', [
          '@layer components {',
          '\t.card {',
          '\t\t@apply p-5 border rounded-md;',
          '\t}',
          '}',
        ])

        frontalIndexBody = tailwindHtml
        break
      default:
        basicSetup()
        break
    }

    // Prepare config files for development features
    if (customInit.devFeatures.includes('typescript')) {
      initiatorConfig.addFile('tsconfig.json', [
        '{',
        '\t"compilerOptions": {',
        '\t\t"baseUrl": ".",',
        '\t\t"paths": {',
        '\t\t\t"@assets/*": ["./assets/*"]',
        '\t\t},',
        '\t\t"target": "ES5",',
        '\t\t"module": "CommonJS",',
        '\t\t"lib": ["ES5", "ScriptHost", "dom"],',
        '\t\t"moduleResolution": "Node",',
        '\t\t"esModuleInterop": true,',
        '\t\t"skipLibCheck": true,',
        '\t\t"skipDefaultLibCheck": true,',
        '\t\t"strict": true,',
        '\t\t"outDir": ".frontal",',
        '\t\t"forceConsistentCasingInFileNames": true',
        '\t},',
        '\t"include": ["./assets"],',
        '\t"exclude": ["node_modules"]',
        '}',
      ])

      // In all cases, frontal.js requires at-least one .js asset
      initiatorConfig.addFile('assets/js/app.ts', ['// @todo write your application code...'])
      frontalMainAssets.push('@assets/js/app.ts')
    } else {
      // In all cases, frontal.js requires at-least one .js asset
      initiatorConfig.addFile('assets/js/app.js', ['// @todo write your application code...'])
      frontalMainAssets.push('@assets/js/app.js')
    }

    if (customInit.devFeatures.includes('babel')) {
      initiatorConfig.addPackage('@babel/core', 'latest')
      initiatorConfig.addPackage('@babel/preset-env', 'latest')
      initiatorConfig.addFile('babel.config.json', [
        '{',
        '\t"presets": [',
        '\t\t[',
        '\t\t\t"@babel/preset-env",',
        '\t\t\t{',
        '\t\t\t\t"targets": {',
        '\t\t\t\t\t"edge": "17",',
        '\t\t\t\t\t"firefox": "60",',
        '\t\t\t\t\t"chrome": "67",',
        '\t\t\t\t\t"safari": "11.1"',
        '\t\t\t\t}',
        '\t\t\t}',
        '\t\t]',
        '\t]',
        '}',
      ])
    }

    if (customInit.devFeatures.includes('postcss') && customInit.cssFramework !== 'tailwindcss') {
      initiatorConfig.addPackage('postcss', 'latest')
      initiatorConfig.addFile('postcss.config.js', ['module.exports = () => ({', '});'])
    }

    if (customInit.devFeatures.includes('eslint')) {
      initiatorConfig.addFile('.eslintrc.json', [
        '{',
        '\t"parserOptions": {',
        '\t\t"ecmaVersion": 6,',
        '\t\t"sourceType": "module",',
        '\t\t"ecmaFeatures": {',
        '\t\t\t"jsx": true',
        '\t\t}',
        '\t},',
        '\t"rules": {',
        '\t\t"semi": "error"',
        '\t}',
        '}',
      ])
    }

    if (customInit.devFeatures.includes('stylelint')) {
      initiatorConfig.addFile('.stylelintrc.json', [
        '{',
        '\t"rules": {',
        '\t\t"color-no-invalid-hex": true',
        '\t}',
        '}',
      ])
    }
  }

  // Prepare index.html file based on previous configuration
  initiatorConfig.addFile('pages/index.html', [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '\t<meta charset="utf-8">',
    '\t<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '\t<meta name="viewport" content="width=device-width, initial-scale=1">',
    '\t<title>Frontal.JS Application</title>',
    '</head>',
    '<body>',
    ...frontalIndexBody.map((l) => `\t${l}`),
    '</body>',
    '</html>',
  ])

  // Prepare frontal.config.js file based on previous configuration
  initiatorConfig.addFile('frontal.config.js', [
    'module.exports = {',
    '\tbundles: {',
    '\t\tmain: {',
    '\t\t\tassets: [',
    ...frontalMainAssets.map((asset, i) => `\t\t\t\t'${asset}'${i + 1 !== frontalMainAssets.length ? ',' : ''}`),
    '\t\t\t],',
    "\t\t\tpages: ['**/*.html']",
    '\t\t}',
    '\t}',
    '}',
  ])

  // Create a new Initiator instance
  const cwd = process.cwd()
  const context = dir === undefined ? '.' : dir
  const location = path.join(cwd, context)
  const initiator = new Initiator(location, initiatorConfig)
  try {
    await initiator.Initiate(context)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
