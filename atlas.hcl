env "local" {
  url = getenv("DATABASE_URL")
  dev = "docker://postgres/16/dev"
  schema {
    src = "ent://ent/schema"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}

