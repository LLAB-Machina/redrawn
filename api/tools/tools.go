//go:build tools

package tools

import (
	_ "ariga.io/atlas/sql/migrate"
	_ "ariga.io/atlas/sql/mysql"
	_ "ariga.io/atlas/sql/postgres"
	_ "ariga.io/atlas/sql/schema"
	_ "ariga.io/atlas/sql/sqlclient"
	_ "ariga.io/atlas/sql/sqlite"
	_ "ariga.io/atlas/sql/sqltool"
	_ "entgo.io/ent/cmd/ent"
	_ "entgo.io/ent/entc/gen"
	_ "entgo.io/ent/entc/load"
	_ "github.com/go-openapi/inflect"
	_ "github.com/olekukonko/tablewriter"
	_ "github.com/spf13/cobra"
	_ "golang.org/x/tools/go/ast/astutil"
	_ "golang.org/x/tools/go/packages"
	_ "golang.org/x/tools/imports"
)
