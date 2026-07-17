export namespace printer {
	
	export class PrintConfig {
	    BatchCode: string;
	    ProductName: string;
	    Message: string;
	    WidthOption: string;
	    WidthVal: number;
	    Format: string;
	    Columns: number;
	    LabelImage: string;
	    LabelRotation: number;
	    QRPosition: string;
	    ProductImage: string;
	
	    static createFrom(source: any = {}) {
	        return new PrintConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.BatchCode = source["BatchCode"];
	        this.ProductName = source["ProductName"];
	        this.Message = source["Message"];
	        this.WidthOption = source["WidthOption"];
	        this.WidthVal = source["WidthVal"];
	        this.Format = source["Format"];
	        this.Columns = source["Columns"];
	        this.LabelImage = source["LabelImage"];
	        this.LabelRotation = source["LabelRotation"];
	        this.QRPosition = source["QRPosition"];
	        this.ProductImage = source["ProductImage"];
	    }
	}

}

