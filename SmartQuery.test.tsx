import { SmartQuery } from "utilities/factories/smart-query/SmartQuery";
import { EXCEPTIONS } from "utilities/factories/smart-query/SmartQueryConstants";

describe("QueryFactory", () => {
    describe("smart sql statement without condition", function () {
        it("is correctly generated with one select field", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);

            // THEN
            const expected = "SELECT {table:id} FROM {table}";
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with multiple fields", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);

            // THEN
            const expected = "SELECT {table:id},{table:name} FROM {table}";
            expect(q.run()).toBe(expected);
        });

        it("throws an error if table contains special characters", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table$";

            // WHEN
            q.select(columns);

            // THEN
            expect(() => {
                q.from(table);
            }).toThrowError(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
        });
    });

    describe("smart sql statement with conditions", function () {
        it("is correctly generated with one where condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.where("id", "=", 1);

            // THEN
            const expected = "SELECT {table:id} FROM {table} WHERE {table:id} = 1";
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with two where conditions joined with AND operator", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table";
            const where =
                // WHEN
                q.select(columns);
            q.from(table);
            q.where("name", "=", "test1");
            q.where("name", "=", "test2");

            // THEN
            const expected =
                "SELECT {table:id},{table:name} FROM {table} WHERE {table:name} = test1 AND {table:name} = test2";
            expect(q.run()).toBe(expected);
        });
    });

    describe("smart sql statement with grouped conditions", function () {
        it("is correctly generated with one grouped condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.where("id", "=", 1);
            q.where(
                new SmartQuery().where("firstName", "=", `'fakeFirstName'`).orWhere("lastName", "=", `'fakeLastName'`)
            );

            // THEN
            const expected = `SELECT {table:id} FROM {table} WHERE {table:id} = 1 AND ({table:firstName} = 'fakeFirstName' OR {table:lastName} = 'fakeLastName')`;
            expect(q.run()).toBe(expected);
        });
    });

    describe("smart sql statement with sql injection", function () {
        it("throws an error if sql is injected at FROM statement", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table' WHERE {table:id} = 1";

            // WHEN
            q.select(columns);

            // THEN
            expect(() => {
                q.from(table);
            }).toThrowError(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE);
        });

        it("filters value if sql is injected at SELECT statement", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name FROM {table}"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);

            // THEN
            const expected = "SELECT {table:id} FROM {table}";
            expect(q.run()).toBe(expected);
        });

        it("throws an error if sql is injected at WHERE statement", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);

            // THEN
            expect(() => {
                q.where("name", "=", "test1 AND {table:id}=1");
            }).toThrowError(EXCEPTIONS.CHARACTERS_DIGITS_UNDERSCORE_DASH);
        });
    });
});
