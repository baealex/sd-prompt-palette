export interface KeywordToCategory {
    id: number;
    order: number;
}

export interface Keyword {
    id: number;
    name: string;
    image?: Image;
    categories?: KeywordToCategory[];
}

export interface Category {
    id: number;
    name: string;
    order: number;
    keywords: Keyword[];
}

export interface Image {
    id: number;
    url: string;
}

export interface Collection {
    id: number;
    image: Image;
    title: string;
    prompt: string;
    negativePrompt: string;
}