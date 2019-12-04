export interface Data {
    unique: number;
    id: string;
    user: string;
    comments: number;
    likes: number;
    hashtags: string[];
    hashtagCount: number
}

export interface Dataset {
    select: boolean;
    name: string;
    source: string;
    files: string;
}

export interface LabelValue {
    label: string,
    value: string
}