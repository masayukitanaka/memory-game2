
-- ひらがなｘカタカナ20文字（10ペアくらい）(1) 基本
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] hiragana-katakana',
  'Match hiragana characters with their katakana equivalents',
  20,
  '["あ", "ア", "い", "イ", "う", "ウ", "え", "エ", "お", "オ", "か", "カ", "き", "キ", "く", "ク", "け", "ケ", "こ", "コ"]'::jsonb
);

-- ひらがなｘカタカナ20文字（10ペアくらい）(2) 濁点・半濁点も合わせて、かつ難しいものをピックアップ（例：ヌやフが間違えやすいので入れる）
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] hiragana-katakana-advanced',
  'Match advanced hiragana characters with their katakana equivalents, including voiced and semi-voiced sounds',
  20,
  '["が", "ガ", "ざ", "ザ", "だ", "ダ", "ば", "バ", "ぱ", "パ", "ぴ", "ピ", "ふ", "フ", "ぶ", "ブ", "ぐ", "グ", "ず", "ズ"]'::jsonb
);

-- ひらがなｘカタカナ20文字（10ペアくらい）(3) 上記2つで使ってないものをできるだけ入れる。10ペアくらい。
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] hiragana-katakana-misc',
  'Match miscellaneous hiragana characters with their katakana equivalents',
  20,
  '["し", "シ", "せ", "セ", "そ", "ソ", "ち", "チ", "つ", "ツ", "て", "テ", "と", "ト","ん","ン", "を","ヲ", "ね", "ネ"]'::jsonb
);
-- ひらがなｘカタカナ20文字（10ペアくらい）マ行、ヤ行、ラ行、ワ行などを中心に。10ペアくらい。
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] hiragana-katakana-misc2',
  'Match miscellaneous hiragana characters with their katakana equivalents, focusing on the Ma, Ya, Ra, and Wa rows',
  28,
  '["ま", "マ", "み", "ミ", "む", "ム", "め", "メ", "も", "モ", "や", "ヤ", "ゆ", "ユ", "よ", "ヨ", "ら", "ラ", "り", "リ", "る", "ル", "れ", "レ", "ろ", "ロ", "わ", "ワ"]'::jsonb
);

-- 英語ｘ日本語の基本フレーズ（Hello, Thank you, Yes, No, Please, Sorryなど）
-- 10ペア程度
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] english-japanese-basics',
  'Match common English phrases with their Japanese translations',
  16,
  '["Hello", "こんにちは", "Thank you", "ありがとう", "Good morning", "おはよう", "Goodbye", "さようなら", "Yes", "はい", "No", "いいえ", "Please", "お願いします", "Sorry", "ごめんなさい"]'::jsonb
);

-- 英語ｘ日本語の基本フレーズ（Hello, Thank you, Yes, No, Please, Sorryなど）(2) より難しいフレーズを追加
INSERT INTO memory_game.decks (deck_id, description, number_of_cards, pairs) VALUES
(
  '[Nihongo] english-japanese-advanced',
  'Match more complex English phrases with their Japanese translations',
  16,
  '["How are you?", "お元気ですか？", "Nice to meet you", "はじめまして", "What is your name?", "お名前は何ですか？", "I do not understand", "わかりません", "Can you help me?", "手伝ってくれますか？", "I would like to order", "注文したいのですが", "Where is the restroom?", "トイレはどこですか？"]'::jsonb
);



