UPDATE public.exercises e SET image_start = CASE c.name
  WHEN 'Pernas' THEN '/__l5e/assets-v1/6ca64b01-9cfb-4277-b6db-f20f4cb5bc83/ex-pernas.jpg'
  WHEN 'Costas' THEN '/__l5e/assets-v1/9ef3befd-0786-485f-8014-9a0114ff77e1/ex-costas.jpg'
  WHEN 'Abdômen' THEN '/__l5e/assets-v1/ada7a78f-3089-4051-9bbc-4ee4f5ee76dc/ex-abdomen.jpg'
  WHEN 'Ombros' THEN '/__l5e/assets-v1/8bbac209-0973-481f-9dbd-3827c5f70eeb/ex-ombros.jpg'
  WHEN 'Peito' THEN '/__l5e/assets-v1/eede024b-a361-43d3-930e-48e72d612b99/ex-peito.jpg'
  WHEN 'Tríceps' THEN '/__l5e/assets-v1/7287c5ba-975e-467c-8ebd-fd270fb4b7e7/ex-triceps.jpg'
  WHEN 'Cardio' THEN '/__l5e/assets-v1/a06c006b-5a9e-4275-b41f-bc73f3da8528/ex-cardio.jpg'
  WHEN 'Bíceps' THEN '/__l5e/assets-v1/98b7fcf6-cf9d-4d24-89d2-b883610ef565/ex-biceps.jpg'
  WHEN 'Funcional' THEN '/__l5e/assets-v1/9409f1dd-72e0-4153-8ffa-86d7a7451097/ex-funcional.jpg'
  WHEN 'Mobilidade e Alongamento' THEN '/__l5e/assets-v1/b0926578-b998-4aba-b87f-42529131ee11/ex-mobilidade.jpg'
END
FROM public.exercise_categories c
WHERE c.id = e.category_id;