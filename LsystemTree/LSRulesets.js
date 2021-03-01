export default class LSRulesets{
    static oak = new Map(
        [
            ['T', [
                { cdf: 0.4, output: 'S(SB)(SB)T(SB)' },
                { cdf: 0.7, output: 'S(SB)(SB)(SB)T(SB)' },
                { cdf: 0.9, output: 'S(SB)(SB)(SB)(SB)T(SB)(SB)' },
                { cdf: 1.0, output: 'S[rT][rT]' },
            ]],
            ['B', [
                { cdf: 0.5, output: '[rS(SL)B](SL)(SL)[rS(SL)B]' },
                { cdf: 1.0, output: '[rS(SL)(SL)B](SL)[rS(SL)(SL)B]' },
            ]],
            ['S', [
                { cdf: 0.98, output: 'S' },
                { cdf: 1.0, output: 'SS' },
            ]],
        ]
    );
}

export { LSRulesets }