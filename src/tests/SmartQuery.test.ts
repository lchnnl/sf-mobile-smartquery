import { DIRECTIONS, SmartQuery } from "../SmartQuery";
import { EXCEPTIONS } from "../SmartQueryConstants";

describe("SmartQuery", () => {
    describe("query statement without condition", function () {
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

    describe("query statement with conditions", function () {
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
            console.log(q.run());
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with two where conditions joined with AND operator", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "name"];
            const table = "table";
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

    describe("query statement with grouped conditions", function () {
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

    describe("query statement with sql injection", function () {
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

    describe("query statement with group by condition", function () {
        it("is correctly generated with one order by condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            //@ts-ignore
            q.orderBy("id", DIRECTIONS.ASC);

            // THEN
            const expected = `SELECT {table:id} FROM {table} ORDER BY {table:id} ASC`;
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with multiple order by condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "id2", "id3"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            //@ts-ignore
            q.orderBy("id", DIRECTIONS.ASC);
            //@ts-ignore
            q.orderBy("id2", DIRECTIONS.DESC);
            //@ts-ignore
            q.orderBy("id3", DIRECTIONS.ASC);

            // THEN
            const expected = `SELECT {table:id},{table:id2},{table:id3} FROM {table} ORDER BY {table:id} ASC,{table:id2} DESC,{table:id3} ASC`;
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with where and order by condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "id2", "id3"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.where("id2", "=", "2")
            //@ts-ignore
            q.orderBy("id", DIRECTIONS.ASC);

            // THEN
            const expected = `SELECT {table:id},{table:id2},{table:id3} FROM {table} WHERE {table:id2} = 2 ORDER BY {table:id} ASC`;
            expect(q.run()).toBe(expected);
        });
    });

        describe("query statement with group by condition", function () {
        it("is correctly generated with one group by condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.groupBy("id");

            // THEN
            const expected = `SELECT {table:id} FROM {table} GROUP BY {table:id}`;
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with multiple group by conditions", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "id2", "id3"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.groupBy("id");
            q.groupBy("id2");

            // THEN
            const expected = `SELECT {table:id},{table:id2},{table:id3} FROM {table} GROUP BY {table:id},{table:id2}`;
            expect(q.run()).toBe(expected);
        });

        it("is correctly generated with where and order by condition", function () {
            // GIVEN
            let q = new SmartQuery();
            const columns = ["id", "id2", "id3"];
            const table = "table";

            // WHEN
            q.select(columns);
            q.from(table);
            q.where("id2", "=", "2")
            q.groupBy("id2");

            // THEN
            const expected = `SELECT {table:id},{table:id2},{table:id3} FROM {table} WHERE {table:id2} = 2 GROUP BY {table:id2}`;
            expect(q.run()).toBe(expected);
        });
    });
});
