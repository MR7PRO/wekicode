DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload post images in avatars bucket'
  ) THEN
    CREATE POLICY "Users can upload post images in avatars bucket"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (
        (
          (storage.foldername(name))[1] = auth.uid()::text
          AND (storage.foldername(name))[2] IN ('posts', 'questions', 'articles')
        )
        OR
        (
          (storage.foldername(name))[1] IN ('posts', 'questions', 'articles')
          AND (storage.foldername(name))[2] = auth.uid()::text
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own post images in avatars bucket'
  ) THEN
    CREATE POLICY "Users can update own post images in avatars bucket"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (
        (
          (storage.foldername(name))[1] = auth.uid()::text
          AND (storage.foldername(name))[2] IN ('posts', 'questions', 'articles')
        )
        OR
        (
          (storage.foldername(name))[1] IN ('posts', 'questions', 'articles')
          AND (storage.foldername(name))[2] = auth.uid()::text
        )
      )
    )
    WITH CHECK (
      bucket_id = 'avatars'
      AND (
        (
          (storage.foldername(name))[1] = auth.uid()::text
          AND (storage.foldername(name))[2] IN ('posts', 'questions', 'articles')
        )
        OR
        (
          (storage.foldername(name))[1] IN ('posts', 'questions', 'articles')
          AND (storage.foldername(name))[2] = auth.uid()::text
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own post images in avatars bucket'
  ) THEN
    CREATE POLICY "Users can delete own post images in avatars bucket"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (
        (
          (storage.foldername(name))[1] = auth.uid()::text
          AND (storage.foldername(name))[2] IN ('posts', 'questions', 'articles')
        )
        OR
        (
          (storage.foldername(name))[1] IN ('posts', 'questions', 'articles')
          AND (storage.foldername(name))[2] = auth.uid()::text
        )
      )
    );
  END IF;
END $$;