import { useState } from 'react';

import { useMemoState } from '~/modules/memo';

const BASE_TERMS = [
    'cinematic lighting',
    'volumetric fog',
    'highly detailed',
    'ultra wide angle',
    'film grain',
    'studio quality',
] as const;

const joinTerms = (terms: readonly string[]) => terms.join(', ');

export function useIdeaGenerator() {
    const [persistedIdea, setPersistedIdea] = useMemoState('idea.last', joinTerms(BASE_TERMS));
    const [idea, setIdea] = useState<string>(persistedIdea);

    const generate = () => {
        const shuffled = [...BASE_TERMS]
            .map((value) => ({ value, score: Math.random() }))
            .sort((a, b) => a.score - b.score)
            .map((item) => item.value);

        const nextIdea = joinTerms(shuffled.slice(0, 4));
        setIdea(nextIdea);
        setPersistedIdea(nextIdea);
    };

    return {
        idea,
        generate,
    };
}
