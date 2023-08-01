# Stable Diffusion Prompt Palette

![](https://github.com/baealex/sd-prompt-palette/assets/35596687/e4310657-7520-4f0b-9645-6e8f754a6461)

![](https://github.com/baealex/sd-prompt-palette/assets/35596687/207c4996-a932-4216-b41d-c328a8397a0d)

![](https://github.com/baealex/sd-prompt-palette/assets/35596687/4e1242f3-e4d6-4265-9b46-18d2da6775f1)

영어가 아직 부족해서 이미지를 자연스럽게 표현하는데 어려움을 겪고 있어서 만들었습니다. 팔레트의 물감처럼 단어를 다룰 수 있게 하는 것이 목표입니다.

<br>

## Feature

- [x] 키워드 클릭시 키워드가 복사됩니다. (https나 localhost 에서만 동작합니다)
- [x] 카테고리와 키워드 오른쪽 클릭시 삭제 및 수정이 가능합니다.
- [x] 카테고리와 키워드의 순서를 변경할 수 있습니다.
- [x] 키워드를 호버하면 단어에 대한 샘플 이미지가 표기됩니다.
- [x] 이미지의 프롬프트를 조회할 수 있습니다.
- [x] 조회한 이미지 & 프롬프트를 저장할 수 있습니다. (리스트 or 갤러리)
- [x] 카테고리의 키워드를 랜덤 조합하여 새로운 아이디어를 얻을 수 있습니다.

<br>

## Demo site

[demo-prompt-palette.baejino.com](https://demo-prompt-palette.baejino.com/)

<br>

## Self-host

### use NodeJS

```
git clone https://github.com/baealex/sd-prompt-palette
cd sd-prompt-palette/server/src && npm i && npm run build:client && npm run start
```

`http://localhost:3332`로 접속할 수 있습니다.

### use Docker

```
docker run \
    -v ./data:/data \
    -v ./assets:/assets \
    -p 3332:3332 \
    baealex/sd-prompt-palette
```

`http://localhost:3332`로 접속할 수 있습니다.
