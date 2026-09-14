export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'perf', 'docs', 'chore', 'ci', 'build', 'revert'],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
