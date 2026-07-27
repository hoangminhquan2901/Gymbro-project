const db = require('../config/db');

// 1. Lấy danh sách tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    // TẮT CACHE ĐỂ NỘI DUNG LUÔN CẬP NHẬT MỚI NHẤT
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const [products] = await db.query(`
            SELECT p.*, 
                   b.Name as BrandName, 
                   c1.Name as CategoryName, 
                   c2.Name as SubCategoryName
            FROM Products p
            LEFT JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN Categories c1 ON p.CategoryID = c1.CategoryID
            LEFT JOIN Categories c2 ON p.SubCategoryID = c2.CategoryID
            ORDER BY p.UpdatedAt DESC
        `);

        for (let product of products) {
            const [flavors] = await db.query(
                'SELECT FlavorID, FlavorName, Stock FROM ProductFlavors WHERE ProductID = ?', 
                [product.ProductID]
            );
            
            const [goals] = await db.query(`
                SELECT g.GoalID, g.Name, g.Slug 
                FROM ProductGoals pg 
                JOIN Goals g ON pg.GoalID = g.GoalID 
                WHERE pg.ProductID = ?
            `, [product.ProductID]);

            product.Flavors = flavors;
            product.Goals = goals;
        }

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 2. Lấy chi tiết 1 sản phẩm theo ProductID
exports.getProductById = async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id).trim();

        const [rows] = await db.query(`
            SELECT p.*, 
                   b.Name as BrandName, 
                   c1.Name as CategoryName, 
                   c2.Name as SubCategoryName
            FROM Products p
            LEFT JOIN Brands b ON p.BrandID = b.BrandID
            LEFT JOIN Categories c1 ON p.CategoryID = c1.CategoryID
            LEFT JOIN Categories c2 ON p.SubCategoryID = c2.CategoryID
            WHERE TRIM(p.ProductID) = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
        }

        const product = rows[0];

        const [flavors] = await db.query('SELECT FlavorID, FlavorName, Stock FROM ProductFlavors WHERE TRIM(ProductID) = ?', [id]);
        
        const [goals] = await db.query(`
            SELECT g.GoalID, g.Name, g.Slug 
            FROM ProductGoals pg 
            JOIN Goals g ON pg.GoalID = g.GoalID 
            WHERE TRIM(pg.ProductID) = ?
        `, [id]);

        product.Flavors = flavors;
        product.Goals = goals;

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 3. Thêm mới sản phẩm (Dùng Transaction)
exports.createProduct = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            ProductID,
            Name,
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image,
            Status = true,
            Flavors = [],
            Goals = []
        } = req.body;

        if (!ProductID || !Name || !BrandID || !CategoryID || !SubCategoryID || Price === undefined) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc của sản phẩm!' });
        }

        const [existing] = await connection.query('SELECT ProductID FROM Products WHERE ProductID = ?', [ProductID]);
        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: `Mã sản phẩm (ProductID) "${ProductID}" đã tồn tại!` });
        }

        const productSql = `
            INSERT INTO Products
            (ProductID, Name, BrandID, CategoryID, SubCategoryID, Price, Image, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(productSql, [
            ProductID.trim(),
            Name.trim(),
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image ? Image.trim() : null,
            Status
        ]);

        if (Array.isArray(Flavors) && Flavors.length > 0) {
            for (const flavor of Flavors) {
                if (flavor.FlavorName || flavor.flavorName) {
                    const fName = flavor.FlavorName || flavor.flavorName;
                    const fStock = flavor.Stock !== undefined ? flavor.Stock : (flavor.stock || 0);
                    await connection.query(
                        'INSERT INTO ProductFlavors (ProductID, FlavorName, Stock) VALUES (?, ?, ?)',
                        [ProductID.trim(), fName.trim(), fStock]
                    );
                }
            }
        }

        if (Array.isArray(Goals) && Goals.length > 0) {
            for (const goalID of Goals) {
                await connection.query(
                    'INSERT INTO ProductGoals (ProductID, GoalID) VALUES (?, ?)',
                    [ProductID.trim(), goalID]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm thành công!',
            data: { ProductID, Name }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Lỗi server khi thêm sản phẩm:', error);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi hệ thống khi thêm sản phẩm.' });
    }
};

// 4. Cập nhật sản phẩm theo ProductID
exports.updateProduct = async (req, res) => {
    const productIdFromUrl = decodeURIComponent(req.params.id).trim();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existingProducts] = await connection.query(
            'SELECT ProductID FROM Products WHERE TRIM(ProductID) = ?',
            [productIdFromUrl]
        );

        if (existingProducts.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm cần cập nhật!'
            });
        }

        const targetProductID = existingProducts[0].ProductID;

        const {
            Name,
            BrandID,
            CategoryID,
            SubCategoryID,
            Price,
            Image,
            Status,
            Flavors = [],
            Goals = []
        } = req.body;

        // XỬ LÝ CHỈ UPDATE STATUS (Toggle Status)
        if (
            Name === undefined &&
            BrandID === undefined &&
            CategoryID === undefined &&
            SubCategoryID === undefined &&
            Price === undefined &&
            Status !== undefined
        ) {
            await connection.query(
                `
                UPDATE Products
                SET
                    status = ?,
                    UpdatedAt = NOW()
                WHERE ProductID = ?
                `,
                [Status ? 1 : 0, targetProductID]
            );

            await connection.commit();
            connection.release();

            return res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công!'
            });
        }

        // KIỂM TRA DỮ LIỆU BẮT BUỘC
        if (!Name || !BrandID || !CategoryID || !SubCategoryID || Price === undefined) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!'
            });
        }

        // UPDATE PRODUCTS
        await connection.query(
            `
            UPDATE Products
            SET
                Name = ?,
                BrandID = ?,
                CategoryID = ?,
                SubCategoryID = ?,
                Price = ?,
                Image = ?,
                status = ?,
                UpdatedAt = NOW()
            WHERE ProductID = ?
            `,
            [
                Name.trim(),
                BrandID,
                CategoryID,
                SubCategoryID,
                Number(Price),
                Image ? Image.trim() : null,
                Status ? 1 : 0,
                targetProductID
            ]
        );

        // UPDATE FLAVORS
        await connection.query(
            'DELETE FROM ProductFlavors WHERE ProductID = ?',
            [targetProductID]
        );

        if (Array.isArray(Flavors)) {
            for (const flavor of Flavors) {
                const flavorName = flavor.FlavorName || flavor.flavorName;
                const stock = flavor.Stock !== undefined ? flavor.Stock : (flavor.stock || 0);

                if (!flavorName) continue;

                await connection.query(
                    `
                    INSERT INTO ProductFlavors (ProductID, FlavorName, Stock)
                    VALUES (?, ?, ?)
                    `,
                    [
                        targetProductID,
                        String(flavorName).trim(),
                        Number(stock) || 0
                    ]
                );
            }
        }

        // UPDATE GOALS
        await connection.query(
            'DELETE FROM ProductGoals WHERE ProductID = ?',
            [targetProductID]
        );

        if (Array.isArray(Goals)) {
            for (const goal of Goals) {
                const goalID = typeof goal === "object" ? goal.GoalID : goal;

                if (!goalID) continue;

                await connection.query(
                    `
                    INSERT INTO ProductGoals (ProductID, GoalID)
                    VALUES (?, ?)
                    `,
                    [targetProductID, Number(goalID)]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công!'
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error('Lỗi server khi cập nhật sản phẩm:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 5. Xóa sản phẩm theo ProductID
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM Products WHERE ProductID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa!' });
        }

        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công!'
        });
    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};