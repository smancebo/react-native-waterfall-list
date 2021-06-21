module.exports = {
  extends: ['@react-native-community', 'plugin:prettier/recommended'],
  plugins: ['simple-import-sort'],
  root: true,
  rules: {
    'import/order': 'off',
    'sort-imports': 'off',
  },
}
